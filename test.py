import numpy as np

import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

# 原始数据
lat_original = np.array([31.837118, 31.838438, 31.839552]).reshape(-1, 1)
lon_original = np.array([117.258562, 117.268614, 117.253446]).reshape(-1, 1)

# 修正后的数据
lat_corrected = np.array([31.837877+0.00215, 31.838438+0.00235, 31.839309+0.00215]).reshape(-1, 1)
lon_corrected = np.array([117.259323-0.0056, 117.268614-0.0056, 117.252997-0.0056]).reshape(-1, 1)

# 计算纬度的差值
lat_diff = lat_corrected - lat_original
lon_diff = lon_corrected - lon_original

# 线性回归模型
lat_model = LinearRegression().fit(lat_original, lat_diff)
lon_model = LinearRegression().fit(lon_original, lon_diff)

# 输出回归系数
print(f"纬度回归公式: Δlat = {lat_model.coef_[0][0]} * lat_original + {lat_model.intercept_[0]}")
print(f"经度回归公式: Δlon = {lon_model.coef_[0][0]} * lon_original + {lon_model.intercept_[0]}")
lat_pred = lat_model.predict(lat_original) + lat_original
lon_pred = lon_model.predict(lon_original) + lon_original

# 绘制原始数据和预测数据的对比图
plt.figure(figsize=(10, 6))

# 纬度
plt.subplot(1, 2, 1)
plt.scatter(lat_original, lat_corrected, color='blue', label='原始数据 vs 修正数据')
plt.plot(lat_original, lat_pred, color='red', label='回归预测')
plt.xlabel('原始纬度')
plt.ylabel('修正纬度')
plt.title('纬度回归预测')
plt.legend()

# 经度
plt.subplot(1, 2, 2)
plt.scatter(lon_original, lon_corrected, color='blue', label='原始数据 vs 修正数据')
plt.plot(lon_original, lon_pred, color='red', label='回归预测')
plt.xlabel('原始经度')
plt.ylabel('修正经度')
plt.title('经度回归预测')
plt.legend()

# 显示图形
plt.tight_layout()
plt.show()